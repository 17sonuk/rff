const { PLATFORM_NAME, PLATFORM_HASHTAG, PLATFORM_URL, FEEDBACK_EMAIL } = require('./commonemailFields');

module.exports = {
    projectCompleteEmail: (name, projectName, amount, projectId) => {
        let url = PLATFORM_URL + "/projectDetails?projectId=" + projectId
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
                <p>Dear ${name},</p><br>
                <p>We are delighted to inform you that the project ${projectName} has completed work, and a payment of $${amount} has been issued. </p>
                <p><b><a href="${url}">Visit the project page to view the results for yourself.</a></b></p>
                <p>We know you are excited to see your donation creating real, tangible results.</p>
                <p>Would you share the success of these communities with your community? The more people that know about ${PLATFORM_NAME} the better chance we have to protect and restore our world’s precious, majestic rainforests and their peoples. And in doing so, safeguard nature’s powerful, natural climate solution. </p>
                <p>Please consider sharing the news on social media using #${PLATFORM_HASHTAG} and tell others why donating through this platform was important to you.</p>
                <p>If you like these results, please consider donating to another project.</p>
                <p><b><a href="${PLATFORM_URL}">Log in today to see how you can build on this positive climate action.</a></b></p>
                <p>If you have any questions or feedback for us, please email ${FEEDBACK_EMAIL}</p>
                <p>With gratitude,<br>
                ${PLATFORM_NAME} Team</p>
            </div>  
        </div>
        </body>
    </html>`
    }
}