from passlib.context import CryptContext

pwd_cxt=CryptContext(schemes=["bcrypt"], deprecated="auto")

class Hash():
    def bcrypt(password : str):
        return pwd_cxt.hash(password)
    def verify(hashed_password,request_password):
        return pwd_cxt.verify(request_password,hashed_password)