module.exports ={
    donorEmail:(name,amount)=>{
        return `<!DOCTYPE html>
<html style="height:100%;">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width"/>
        <title>Thank You</title>
    </head>
    <body style="margin:0px; padding:0px; height:100%; " >
        <table style="vertical-align:top; font-family:Arial, Helvetica, sans-serif; color:#3a3a3a;font-size:14px; no-repeat;background-size:cover;background-position:center; background-color:#38404c; " width="100%" height="100%" border="0" cellspacing="20" cellpadding="0">
            <tr>
                <td>
                    <table cellspacing="0" cellpadding="0" style="max-width:600px; background:#fff; width:100%; margin:0 auto;padding:0;box-sizing:border-box;border-collapse:collapse; ">
                        <tr>
                            <td style="">
                            <table cellspacing="0" cellpadding="0" style="padding:40px 40px; width:100%; box-sizing:border-box;">
                            <tr>
                                <td style="margin:0px;">
                                <h2 style="font-size:16px;font-weight:600;font-size:20px; color:#000; text-align:center;text-transform:none;margin:0px; ">Thank you ${name}!</h2>
                                </td>
                            </tr>
                            <tr>
                                <td style="margin:0px;text-align:center;padding:30px 0px;line-height: 23px; font-size:16px;color:#3a3a3a;">
                                <p style=" margin: 0px; line-height: 23px; font-size:16px;color:#3a3a3a;">You have successfully donated $${amount}.</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="text-align:center; padding:0px"></td>
                            </tr>
                            </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>`
    }
}