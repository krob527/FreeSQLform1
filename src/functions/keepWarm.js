const { app } = require('@azure/functions');

// Runs every 4 minutes to keep the function app warm and prevent cold starts.
// Without this, Azure Functions on the Consumption plan will spin down after
// ~5 minutes of inactivity, causing 30-45 second delays on the next request.
app.timer('keepWarm', {
  schedule: '0 */4 * * * *', // every 4 minutes
  handler: (myTimer, context) => {
    context.log('Keep-warm ping');
  }
});
