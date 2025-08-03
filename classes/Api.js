const { responce_status } = require("../constraints/RESPONCE_STATUS");
const CustomError = require("./Error");
class API {
  constructor(request, responce, query = null,queryParams=[]) {
    this.req = request;
     this.res = responce;
      this.query = query;
    this.queryParams = queryParams;
  }
  /**
   * Description
   * @returns {any}
   */
  getParams() {
    return this.req.params;
  }
  logRequest() {
    console.info({
      method: this.req.method,
      path: this.req.path,
      params: this.req.params,
      query: this.req.query,
      body: this.req.body,
      headers: this.req.headers,
      user: this.req.user,
    });
  }
  /**
   * Description
   * 
   */
  getQuery() {
    const excludeFields = ["sort", "limit", "page", "fields"];
    let query = this.req.query;
    let queryObject = { ...query };
    const otherQuery = {};
    excludeFields.forEach((el) => {
      otherQuery[el] = queryObject[el];
      delete queryObject[el];
    });
    let filteringQuery = JSON.stringify(queryObject);
    filteringQuery = filteringQuery.replace(
      /\b(gte|lte|lt|gt)\b/g,
      (match) => `$${match}`
    );
    /**
     * @returns {allQuery: query,otherQuery,filteringQuery}
     */
    return {
      allQuery: query,
      otherQuery,
      filteringQuery,
    };
  }
  logRequest() {
    console.info({
      method: this.req.method,
      path: this.req.path,
      params: this.req.params,
      query: this.req.query,
      body: this.req.body,
      headers: this.req.headers,
      user: this.req.user,
    });
  }
  // Authorization
  /**
   * 
   * @param {[string]} requiredPermissions 
   * @returns {Boolean}
   */
  checkPermissions(requiredPermissions) {
    const userPermissions = this.user.role;
    const hasPermission = requiredPermissions.every(perm => userPermissions.includes(perm));
    if (!hasPermission) {
      return false
    }
    return true
  }
  /**
   * Description 
   *@param {keyof responce_status} type='default'
   * @param {any} data=null
   * @param {String} customMsg=''
   * @param {number} status=null
   * @returns {any}
   */
  dataHandler(type = "default", data = null, customMsg ='', status = null) {
    let improvedData = {};
    if (data) {
      improvedData = {
        status: "success",
        length: data.length,
        data,
        msg: responce_status[type].msg,
        customMsg,
      };
    } else {
      improvedData = {
        status: "successed",
        msg: responce_status[type].msg,
        customMsg,
      };
    }

    this.res.status(status || responce_status[type].status).json(improvedData);
  }
  /**
   * Description
    *@param {keyof responce_status} type ='server_error
   * @param {string} message=null
   * @param {number} customStatus=null
   * @returns {any}
   */
  errorHandler(type = "server_error", message = null, customStatus = null) {
    const customError = new CustomError(
      message || responce_status[type].msg,
      customStatus || responce_status[type].status
    );
    return customError;
  }
  /**
   * Description
   * @param {import("express").Request} query
   */
  modify(query,queryParams) {
    this.query = query;
    this.queryParams = queryParams
    /**
     * @returns {this}
     */
    return this
  }
  sort() {
  const sortQuery = this.getQuery().otherQuery?.sort;
  const sortStage = sortQuery
    ? sortQuery.split(',').reduce((acc, field) => {
        const [key, order] = field.startsWith('-')
          ? [field.slice(1), -1]
          : [field, 1];
        acc[key] = order;
        return acc;
      }, {})
    : { createdAt: -1 };

  // Handle aggregate or find
  if (Array.isArray(this.query?._pipeline)) {
    this.query._pipeline.push({ $sort: sortStage });
  } else {
    this.query = this.query.sort(sortStage);
  }

  return this;
}
  filter(searchableFields = [], numericFields = []) {
  const queryFilter = JSON.parse(this.getQuery().filteringQuery || '{}');

  // Build $match object
  const match = {};
  for (let key of Object.keys(queryFilter)) {
    const value = queryFilter[key];

    if (value === undefined || value === '') continue;

    if (numericFields.includes(key)) {
      match[key] = parseInt(value);
    } else if (searchableFields.includes(key)) {
      match[key] = { $regex: new RegExp(value, 'i') };
    } else {
      match[key] = value;
    }
  }

  // If this.query is an aggregation pipeline (array), inject $match
  if (Array.isArray(this.query?._pipeline)) {

    this.query._pipeline.unshift({ $match: match });
  } else {
    this.query = this.query.find(match);
  }

  return this;
}
  limitFields(fieldsItems) {
 
    const fieldQuery =  this.getQuery().otherQuery.fields ;
    if (fieldQuery) {
      
      const fields = fieldQuery.split(",").join(" ");
      
      
      this.query = this.query.select(fields);
    } 
    else if(fieldsItems){

      const fields = fieldsItems.join(" ");
      
      this.query = this.query.select(fields);
      
    }else  {
      this.query = this.query.select("-__v");
    }
    return this;
  }
  paginate() {
    const page = this.getQuery().otherQuery.page * 1 || 1;
    const limit = this.getQuery().otherQuery.limit * 1 || 10;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
  /**
   * Description 
   *@param {'Access-Control-Allow-Origin'|'Access-Control-Allow-Methods'|'Access-Control-Max-Age'|'Content-Type'|'methods'|'allowedHeaders'|'exposedHeaders'|'credentials'|'origin'|'authorization'} key=null

   * @returns {any}
   */
  getHeaders(key=null) {
   const headers = this.req.headers
   return key?headers[key]:headers


  }
  /**
   * Description 
   *@param {'Access-Control-Allow-Origin'|'Access-Control-Allow-Methods'|'Access-Control-Max-Age'|'Content-Type'|'methods'|'allowedHeaders'|'exposedHeaders'|'credentials'|'origin'|'authorization'} key
   *@param {any} value 
   * @returns {never}
   */
  setHeader(key,value){
    res.setHeader(key, value);
  }
  /**
   * Set cookies in the response.
   * @param {Object} data - Cookie data.
   * @param {{ 
  * httpOnly:Boolean,
  * maxAge:Number,
  * expires:Number,
  * domain:String,
  * path:String,
  * secure:Boolean,
  * sameSite:(Boolean|['strict','lax']),
  * signed:Boolean,
  * priority:['low','medium','high'],
  * encode}} [options={}] - Cookie options.
  */
  setCookie(data,options={}) {
//https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
//https://dev.to/m__mdy__m/understanding-cookies-and-sessions-in-nodejs-3449
    const defaultOptions = {
       httpOnly: true,        // Recommended for security
  secure: true,          // REQUIRED for HTTPS in production
  sameSite: 'none',      // Needed for cross-domain cookies
  maxAge: 1000 * 60 * 60 * 24 * 7,
      
  }
  const finalOptions = { ...defaultOptions, ...options };
    for(let key of Object.keys(data)){
      this.res.cookie(key, data[key], finalOptions)
    }
  }
  getCookie(name=null) {
   const cookies =name? this.req.cookies[name]:this.req.cookies
   return cookies
  }
}
module.exports = API
/*
sort {
  1- accept string ('n1 n2 m3' )
  2-   - for desc     +for asc  
  3- sort({
    name:'asc',
    age:'desc'
  })
}


skip
limit
select



*/
