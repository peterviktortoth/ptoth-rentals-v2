import AWS from 'aws-sdk';

// Configure AWS Region
AWS.config.update({ region: 'us-east-2' });

const cloudwatchlogs = new AWS.CloudWatchLogs();

export const logExternalLinkClick = async (url) => {
  const params = {
    logGroupName: 'externalLinkClick',
    logStreamName: 'externalLinkClick',
    logEvents: [
      {
        timestamp: new Date().getTime(),
        message: `External link clicked: ${url}`
      }
    ],
  };

  try {
    await cloudwatchlogs.putLogEvents(params).promise();
  } catch (error) {
    console.error('Error logging external link click:', error);
  }
};
