import { apiresponse } from "../utils/api_response.js";
import { asynchandler } from "../utils/asynchandler.js";

/** 
const healthcheck = async (req,res,next) => {
    try {
        const user = await getuserformat()
        res
        .status(200)
        .json(new apiresponse(200,{
            message:"server is running"
        }))
    } catch (error) {
        next(error);
    }

}

*/

const healthcheck = asynchandler(async(req,res) =>{
    res.status(200).json(
        new apiresponse(200,{message:"server is running"}));
    });

export{healthcheck};