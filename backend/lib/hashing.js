import bcrypt from "bcryptjs";
import { createHmac } from "crypto";


export const doHash = async (value, saltValue) => {
    const result = await bcrypt.hash(value, saltValue);
    return result;
};

export const doHashValidation = async (value, hashedValue) =>{
    const result = await bcrypt.compare(value, hashedValue);
    return result;
}

export const hmacProcess = (value,key) =>{
    const result = createHmac('sha256',key).update(value,'utf8').digest('hex');
    return result;
}