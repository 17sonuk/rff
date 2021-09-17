const { PLATFORM_NAME, PLATFORM_URL, FEEDBACK_EMAIL, } = require('./commonemailFields')

module.exports = {
    institutionRegEmail: (firstName, orgName) => {
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
            <p>Dear <b>${firstName}</b>,</p><br>
            <p>We are honored to welcome ${orgName} to the ${PLATFORM_NAME} community</p>
            <p>${orgName}’s participation carries the potential to protect and restore the tropical rainforests that the world relies on as a counterweight against catastrophic climate change.</p>
            <p><b><a href="${url}">Support a project today and see the impact of your contribution for yourselves.</a><b> </p>
            <p>The communities leading projects on ${PLATFORM_NAME}  are stewards of land that is rich in carbon--a vital element to stabilize the global climate. Their lives and livelihoods are deeply connected to the forests, making them the best positioned to protect and restore them.</p>
            <p>Yet, financial incentives for extractive activities or other land uses, like agriculture, puts healthy forests at risk. Your support provides a key source of income to these communities to pursue a sustainable, climate-friendly economy. Importantly, your support also signals to the international community the importance of investing in rainforests and their peoples as a climate solution.</p>
            <p>We are in the eleventh hour of the climate crisis. If we continue with business as usual, we will most certainly witness signs of total ecosystem collapse in our lifetimes. The good news is we still have time to turn the tide, and effective action starts here, with these communities. You’ll see the results, we promise.</p>
            <p><b><a href="${PLATFORM_URL}">Log in today, support a project, and make your contribution count.</a></b></p>
            <p>And please share this journey with ${orgName}'s employees, partners and affiliates. We won’t make it alone. Let’s continue to build this community together, and bring tangible change in addressing the climate crisis before us.</p>
            <p>If you have any questions or feedback for us, please email ${FEEDBACK_EMAIL}</p>
            <p>With gratitude,<br>
            <b>${PLATFORM_NAME} Team</b></p>
        </div>   
    </div>
    </body>
</html>`
    }
}