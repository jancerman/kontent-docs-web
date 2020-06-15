const axios = require('axios');
const generator = require('generate-password');
const consola = require('consola');

const settings = {
    auth: {
        username: process.env['LMS.id'] || '',
        password: ''
    },
    registerUrl: 'https://kontent-kentico.talentlms.com/api/v1/usersignup',
    addToCourseUrl: 'https://kontent-kentico.talentlms.com/api/v1/addusertocourse'
};

const register = async (data) => {
    try {
        await axios({
            method: 'post',
            url: settings.registerUrl,
            data: data,
            auth: settings.auth
        });
    } catch (error) {
        consola.error(error.response.data);
    }

    return false;
};

const add = async (data) => {
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
        consola.error(error.response.data);
        addedToCourse = error.response.data;
    }

    return addedToCourse;
}

const lms = {
    registerAddtoCourse: async (data) => {
        data.login = data.email;
        data.password = generator.generate({
            length: 8,
            numbers: true
        });

        // Register user to LMS or get to know the user is already registered
        // Do not need to check the result as the outcome is a registered user
        await register(data);

        // Add the user to a course by email
        const addedToCourse = await add(data);

        // If user already enrolled to the course
        if (addedToCourse.error) {
            return true;
        }

        return false;
    }
}

module.exports = lms;
