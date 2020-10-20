const axios = require('axios');
const consola = require('consola');
const commonContent = require('./commonContent');
const handleCache = require('./handleCache');
const lms = require('./lms')

const isCourseAvailable = (user) => {
  if (user.email.endsWith('@kentico.com')) {
    return true;
  }

  for (let i = 0; i < user.customerSuccessSubscriptions.length; i++) {
    if (user.customerSuccessSubscriptions[i].isPartner) {
      return true
    }

    for (let j = 0; j < user.customerSuccessSubscriptions[i].activePackages.length; j++) {
      if (user.customerSuccessSubscriptions[i].activePackages[j].name === 'elearning-all') {
        return true;
      }
    }
  }

  return false;
}

const getTrainingCourseInfo = async (content, req, res) => {
  const UIMessagesObj = await handleCache.ensureSingle(res, 'UIMessages', async () => {
    return await commonContent.getUIMessages(res);
  });

  const UIMessages = UIMessagesObj && UIMessagesObj.length ? UIMessagesObj[0] : null

  // If user is not authenticated
  if (!req.user) {
    req.session.returnTo = req.originalUrl;
    return {
      text: UIMessages.training___sign_in.value,
      url: '/login'
    };
  }

  // Get additional info about authenticated user
  let user;
  try {
    user = await axios.get(`${process.env['SubscriptionService.Url']}${req.user.emails[0].value}/`, {
      headers: { Authorization: `Bearer ${process.env['SubscriptionService.Bearer']}` }
    });
  } catch (error) {
    consola.error(error.response.data);
  }

  if (!user) {
    return {
      text: 'User is not available in the subscription service',
      url: '#'
    };
  }

  // If user has access to courses
  if (!isCourseAvailable(user.data)) {
    return {
      text: UIMessages.training___cta_buy_course.value,
      url: UIMessages.training___cta_buy_link.value
    };
  }

  // Register user in LMS and course and get info about course url and completion
  const courseInfo = await lms.handleTrainingCourse(user.data, content.talentlms_course_id.value);
  let text = '';

  if (courseInfo.completion === 0) {
    text = UIMessages.training___cta_start_course.value;
  } else if (courseInfo.completion === 100) {
    text = UIMessages.training___cta_revisit_course.value;
  } else if (courseInfo.completion === 101) {
    text = 'User info is not available in LMS';
  } else if (courseInfo.completion === 102) {
    text = 'Course info is not available in LMS';
  } else {
    text = UIMessages.training___cta_resume_course.value;
  }

  return {
    text: text,
    url: courseInfo.url
  };
};

module.exports = getTrainingCourseInfo;
