const axios = require('axios');
const commonContent = require('./commonContent');
const handleCache = require('./handleCache');

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

  if (!req.user) {
    req.session.returnTo = req.originalUrl;
    return {
      text: UIMessages.training___sign_in.value,
      url: '/login'
    };
  }

  const user = await axios.get(`https://subscription-service-qa.azurewebsites.net/api/internal/cs-services-user/${req.user.emails[0].value}/`, {
    headers: { Authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjpbImNzc2VydmljZXNyZWFkZXIiXSwiaXNzIjoia2VudGljb2Nsb3VkIiwiYXVkIjoic3Vic2NyaXB0aW9uc2VydmljZSIsImV4cCI6MTYwOTUwMjQwMCwibmJmIjoxNDkzOTAxNTgwfQ.pg51UWooxD-xyKAYhqr-_EHOQ5ljIg0jdkdDU3NmLxY' }
  });

  if (!isCourseAvailable(user.data)) {
    return {
      text: UIMessages.training___cta_buy_course.value,
      url: UIMessages.training___cta_buy_link.value
    };
  }

  console.log(user.data);

  return {
    text: 'Signed in',
    url: '#'
  };
};  

module.exports = getTrainingCourseInfo;