from dotenv import load_dotenv
import os
import smtplib
from email.mime.text import MIMEText

load_dotenv()

def send_email(to_email,subject,body):
    msg=MIMEText(body)
    msg["Subject"]=subject
    msg["From"]=os.getenv("EMAIL")
    msg["TO"]=to_email

    with smtplib.SMTP_SSL("smtp.gmail.com",465) as server:
        server.login(os.getenv("EMAIL"),os.getenv("APP_PASSWORD"))
        server.sendmail(os.getenv("EMAIL"),to_email,msg.as_string())