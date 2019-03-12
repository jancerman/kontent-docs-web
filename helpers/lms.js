const axios = require('axios');
const generator = require('generate-password');

const lms = {
    registerAddtoCourse: async (data) => {
        const settings = {
            auth: {
                username: process.env['LMS.id'] || '',
                password: ''
            },
            registerUrl: 'https://learn.with.kentico.com/api/v1/usersignup',
            addToCourseUrl: 'https://learn.with.kentico.com/api/v1/addusertocourse'
        };

        data.login = data.email;
        data.password = generator.generate({
            length: 8,
            numbers: true
        });

        // Register user to LMS or get to know the user is already registered
        // Do not need to check the result as the outcome is a registered user
        try {
            await axios({
                method: 'post',
                url: settings.registerUrl,
                data: data,
                auth: settings.auth
            });
        } catch (error) {
            console.error(error.response.data);
        }

        // Add the user to a course by email
        let addedToCourse;

        try {
            let inCourse = await axios({
                method: 'post',
                url: settings.addToCourseUrl,
                data: {
                    user_email: data.email,
                    course_id: 170
                },
                auth: settings.auth
            });
            addedToCourse = inCourse.data;
        } catch (error) {
            console.error(error.response.data);
            addedToCourse = error.response.data;
        }

        // If user already enrolled to the course
        if (addedToCourse.error) {
            return true;
        }

        return false;
    }
}

module.exports = lms;
