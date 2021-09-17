const { PLATFORM_NAME, PLATFORM_HASHTAG, PLATFORM_URL, FEEDBACK_EMAIL } = require('./commonemailFields')

module.exports = {
    milestoneEmail: (name, projectName, amount, projectId, desc1) => {
        let url = PLATFORM_URL + "/projectDetails?projectid=" + projectId
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
                <p>We are delighted to inform you that the project ${projectName} has hit a mid-project milestone target, and a payment of $${amount} has been issued. </p>
                <p>What are mid-project milestone targets?</p>
                <p>They’re the documentation that the communities involved in this project have submitted as evidence of expected performance.</p>

                <p><b><a href="${url}">Visit the project page to view the results for yourself.</a></b></p>

                <p>We know you are excited to see your donation creating real, tangible results.</p>
                <p>Would you share the success of these communities with your community? The more people that know about ${PLATFORM_NAME} the better chance we have to protect and restore our world’s precious, majestic rainforests and their peoples. And in doing so, safeguard nature’s powerful, natural climate solution. </p>
                <p>Please consider sharing the news on social media using #${PLATFORM_HASHTAG} and tell others why donating through this platform was important to you.</p>
                <p>What’s next?</p>
                <p>Validated phase details: ${desc1}</p>
                <p>If you have any questions or feedback for us, please email ${FEEDBACK_EMAIL}</p>
                <p>With gratitude,<br>
                ${PLATFORM_NAME} Team</p>
            </div>  
        </div>
        </body>
    </html>`
    }
}