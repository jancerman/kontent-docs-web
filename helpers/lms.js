/* eslint no-unused-vars: 0 */

const axios = require('axios');
const generator = require('generate-password');
const consola = require('consola');

const settings = {
    auth: {
        username: process.env['LMS.id'] || '',
        password: ''
    },
    registerUrl: 'https://kontent-kentico.talentlms.com/api/v1/usersignup',
    addToCourseUrl: 'https://kontent-kentico.talentlms.com/api/v1/addusertocourse',
    getUserByEmailUrl: 'https://kontent-kentico.talentlms.com/api/v1/users/email',
    editUserUrl: 'https://kontent-kentico.talentlms.com/api/v1/edituser',
    statusUrl: 'https://kontent-kentico.talentlms.com/api/v1/getuserstatusincourse',
    goToUrl: 'https://kontent-kentico.talentlms.com/api/v1/gotocourse'
};

const registerUser = async (data) => {
    let userCreated = true;

    try {
        await axios({
            method: 'post',
            url: settings.registerUrl,
            data: data,
            auth: settings.auth
        });
    } catch (error) {
        userCreated = false;
    }

    return userCreated;
};

const addUserToCourse = async (data) => {
    let addedToCourse;

    try {
        const inCourse = await axios({
            method: 'post',
            url: settings.addToCourseUrl,
            data: {
                user_email: data.email,
                course_id: data.course_id || 0
            },
            auth: settings.auth
        });
        addedToCourse = inCourse.data;
    } catch (error) {
        addedToCourse = error.response.data;
    }

    return addedToCourse;
};

const getUserByEmail = async (email) => {
    const user = await axios({
        method: 'get',
        url: `${settings.getUserByEmailUrl}:${email}`,
        auth: settings.auth
    });

    return user.data;
};

const updateUser = async (data) => {
    try {
        await axios({
            method: 'post',
            url: settings.editUserUrl,
            data: data,
            auth: settings.auth
        });
    } catch (error) {
        consola.error(error.response.data);
    }
};

const getStatus = async (courseId, userId) => {
    const status = await axios({
        method: 'get',
        url: `${settings.statusUrl}/course_id:${courseId},user_id:${userId}`,
        auth: settings.auth
    });

    return status.data;
};

const getGoTo = async (courseId, userId) => {
    const goto = await axios({
        method: 'get',
        url: `${settings.goToUrl}/user_id:${userId},course_id:${courseId}`,
        auth: settings.auth
    });

    return goto.data;
};

const getDate = (date) => {
    const dateSplit = date.split('/');
    const validDate = `${dateSplit[1]}/${dateSplit[0]}/${dateSplit[2]}`;

    return (new Date(validDate)).getTime();
};

const getCertificate = (user, courseId) => {
    if (!user.certifications) return null;
    courseId = courseId.toString();

    for (let i = 0; i < user.certifications.length; i++) {
        if (user.certifications[i].course_id === courseId) {
            const expDate = getDate(user.certifications[i].expiration_date);

            if (expDate > (new Date()).getTime()) {
                return user.certifications[i].public_url;
            }
        }
    }

    return null;
};

const lms = {
    registerAddtoCourse: async (data) => {
        data.login = data.email;
        data.password = generator.generate({
            length: 8,
            numbers: true
        });

        // Register user to LMS or get to know the user is already registered
        // Do not need to check the result as the outcome is a registered user
        await registerUser(data);

        // Add the user to a course by email
        const addedToCourse = await addUserToCourse(data);

        // If user already enrolled to the course
        if (addedToCourse.error) {
            return true;
        }

        return false;
    },
    handleTrainingCourse: async (data, courseId) => {
        const user = {};
        user.login = data.email;
        user.email = data.email;
        user.first_name = data.firstName;
        user.last_name = data.lastName;
        user.password = generator.generate({
            length: 8,
            numbers: true
        });

        const userCreated = await registerUser(user);
        const userLMS = await getUserByEmail(user.login);

        if (!userLMS) {
            return {
                url: '#',
                completion: 101
            }
        }

        const userToBeUpdated = !userCreated && userLMS && (data.firstName !== userLMS.first_name || data.lastName !== userLMS.last_name);

        if (userToBeUpdated) {
            const userUpdateData = {
                user_id: userLMS.id,
                first_name: user.first_name,
                last_name: user.last_name
            };

            // TBD: the edit user endpoint returns error 'Invalid arguments provided'
            // console.log(userUpdateData);
            // await updateUser(userUpdateData);
        }

        await addUserToCourse({
            email: user.email,
            course_id: courseId
        });

        const status = await getStatus(courseId, userLMS.id);
        const goTo = await getGoTo(courseId, userLMS.id);
        const certificate = getCertificate(userLMS, courseId)

        if (!status || !goTo) {
            return {
                url: '#',
                completion: 102
            }
        }

        return {
            url: goTo.goto_url,
            completion: parseInt(status.completion_percentage),
            certificate: certificate
        }
    }
}

module.exports = lms;
