class apierror extends Error{
    constructor(
        statuscode,
        message = "something is wrong",
        errors = [],
        stack=""
){
    super(message);
    this.statuscode = statuscode;
    this.statusCode = statuscode;
    this.data = null ;
    this.message = message;
    this.sucess = false;
    this.errors = errors;


if (stack) {
    this.stack = stack;
    
} else {
    Error.captureStackTrace(this,this.constructor)
}
  }
}

export{apierror};