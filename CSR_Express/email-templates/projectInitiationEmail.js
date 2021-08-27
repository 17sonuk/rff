require('dotenv').config();
const { PLATFORM_NAME, PLATFORM_HASHTAG } = process.env;

module.exports = {
    projectInitiationEmail: (projectName, firstName, desc, date) => {
        return `<!DOCTYPE html>
<html style="height:100%;">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width"/>
        <title></title>
    </head>
    <body>
    <div>
        <div margin-top: 10px; margin-right: 10px; margin-left: 10px;>
            <p>Dear ${firstName},</p><br>
            <p>We are excited to share that, thanks to your financial contribution, the project ${projectName} has now commenced activities! </p>
            <p>${desc}</p>
            <p>Your commitment is key to seeing community-based climate solutions in action and bringing us all closer to a hospitable planet. </p>
            <p>What’s next?</p>
            <p>You can expect to receive periodic updates as this project hits its project milestones. The next milestone for this project is set to take place around ${date}.</p>
            <p>Please consider sharing the news on social media using #${PLATFORM_HASHTAG} and tell others why donating through this platform was important to you.</p>
            <p>If you have any questions or feedback for us, please email blockchain@rffny.org</p>
            <p>With gratitude,<br>
            <b>${PLATFORM_NAME}</b></p>
        </div>   
    </div>
    </body>
</html>`
    }
}