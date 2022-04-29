require('dotenv').config();
const { PLATFORM_NAME, PLATFORM_URL } = process.env;

module.exports = {
    userNameEmail: (userName) => {
        let url = PLATFORM_URL
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
            <p>Dear User,</p><br>
            <p>We are honored to welcome you to the ${PLATFORM_NAME} community. </p>
            <p>Here is your UserName! <b>${userName}</b> </p>
            <p><b><a href="${url}">Log in today, support a project, and make your contribution count.</a></b></p>
            <p>And please share your journey (and feel free to tag us on social media!). We won’t make it alone. Let’s continue to build this community together, and bring tangible change in addressing the climate crisis before us.</p>
            <p>If you have any questions or feedback for us, please email blockchain@rffny.org</p><br>
            <p>With gratitude,<br>
            ${PLATFORM_NAME} Team</p>
        </div>   
    </div>
    </body>
</html>`
    }
}