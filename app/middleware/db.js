const {
  buildSuccObject,
  buildErrObject,
  itemNotFound
} = require('../middleware/utils')

/**
 * Builds sorting
 * @param {string} sort - field to sort from
 * @param {number} order - order for query (1,-1)
 */
const buildSort = (sort, order) => {
  const sortBy = {}
  sortBy[sort] = order
  return sortBy
}

/**
 * 
 * @param {*} result 
 */

const updateOneClient = (model, query = {}, data = {}) => new Promise((resolve, reject) => {
  model.findOneAndUpdate(query,{$set:data},{new: true},(errUpdate, result)=>{
    if(errUpdate){
      reject(errUpdate)
        // console.log("error",errUpdate);
    }
    if(result){
        resolve(result)
    }
  })
})



/**
 * Hack for mongoose-paginate, removes 'id' from results
 * @param {Object} result - result object
 */
const cleanPaginationID = (result) => {
  result.docs.map((element) => delete element.id)
  return result
}

/**
 * Builds initial options for query
 * @param {Object} query - query object
 */
const listInitOptions = async (req) => {
  return new Promise((resolve) => {
    const order = req.query.order || -1
    const sort = req.query.sort || 'createdAt'
    const sortBy = buildSort(sort, order)
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 5
    const options = {
      sort: sortBy,
      lean: true,
      page,
      limit
    }
    resolve(options)
  })
}

module.exports = {
  /**
   * Checks the query string for filtering records
   * query.filter should be the text to search (string)
   * query.fields should be the fields to search into (array)
   * @param {Object} query - query object
   */
  async checkQueryString(query) {
    return new Promise((resolve, reject) => {
      try {
        if (
          typeof query.filter !== 'undefined' &&
          typeof query.fields !== 'undefined'
        ) {
          const data = {
            $or: []
          }
          const array = []
          // Takes fields param and builds an array by splitting with ','
          const arrayFields = query.fields.split(',')
          // Adds SQL Like %word% with regex
          arrayFields.map((item) => {
            array.push({
              [item]: {
                $regex: new RegExp(query.filter, 'i')
              }
            })
          })
          // Puts array result in data
          data.$or = array
          resolve(data)
        } else {
          resolve({})
        }
      } catch (err) {
        console.log(err.message)
        reject(buildErrObject(422, 'ERROR_WITH_FILTER'))
      }
    })
  },

  /**
   * Gets items from database
   * @param {Object} req - request object
   * @param {Object} query - query object
   */
  async getItems(req, model, query) {
    const options = await listInitOptions(req)
    return new Promise((resolve, reject) => {
      model.paginate(query, options, (err, items) => {
        if (err) {
          reject(buildErrObject(422, err.message))
        }
        resolve(cleanPaginationID(items))
      })
    })
  },

  /**
   * Gets item from database by id
   * @param {string} id - item id
   */
  async getItem(id, model) {
    return new Promise((resolve, reject) => {
      model.findById(id, (err, item) => {
        itemNotFound(err, item, reject, 'NOT_FOUND')
        resolve(item)
      })
    })
  },
  async getItemespecific(id, model) {
    return new Promise((resolve, reject) => {
      model.findOne({idoriginal: id }, (err, item) => {
        itemNotFound(err, item, reject, 'NOT_FOUND')
        resolve(item)
      })
      // MyModel.find({ name: 'john', age: { $gte: 18 }});

      // model.find(query,{$set:data},{new: true},(errUpdate, result)=>{
      //   if(errUpdate){
      //     reject(errUpdate)
      //       // console.log("error",errUpdate);
      //   }
      //   if(result){
      //       resolve(result)
      //   }
      // })
    })
  },
  /**
   * Creates a new item in database
   * @param {Object} req - request object
   */
  async createItem(req, model) {
    return new Promise((resolve, reject) => {
      model.create(req, (err, item) => {
        if (err) {
          reject(buildErrObject(422, err.message))
        }
        resolve(item)
      })
    })
  },
  async getRamdominterno(req, model) {
    let qq = []
    let count = parseInt(req.count);
    let type = req.identification;

    // eliminar para quitar limites
    if(type == 'unique') {
 return new Promise((resolve, reject) => {
        model.aggregate([ { 
          $match: { 
            box: {$exists: false},
            tallaz: '41'
           }},  
          { $sample: { size: count } }],
           (err, item) => {
          if (err) {
            reject(buildErrObject(422, err.message))
          }else{
            item.forEach( user => {
             const a = updateOneClient(model, {_id:user._id},{box:req});
             qq.push(a)
            }) 
        
            Promise.all(qq).then(p => resolve(true))
          }
      
        })
      })
    } else {
      return new Promise((resolve, reject) => {
        model.aggregate([{ $match: { box: {$exists: false}} }, { $sample: { size: count } }], (err, item) => {
          if (err) {
            reject(buildErrObject(422, err.message))
          }else{
            item.forEach( user => {
             const a = updateOneClient(model, {_id:user._id},{box:req});
             qq.push(a)
            }) 
        
            Promise.all(qq).then(p => resolve(true))
          }
      
        })
      })
    }
  
  },

  async getRamdom(req, model) {

    ramdons = []
    return new Promise((resolve, reject) => {
      req.forEach(element => {
        const a =  this.getRamdominterno(element, model);
        ramdons.push(a);
      })
      Promise.all(ramdons).then( o => {
        console.log('YA TERMINE la primera vuelta') 
      }).then(p => resolve(true))
    })
    // let qq = []
    // let count = parseInt(req[0].count);
    // return new Promise((resolve, reject) => {
    //   model.aggregate([{ $match: { box: {$exists: false}} }, { $sample: { size: count } }], (err, item) => {
    //     if (err) {
    //       reject(buildErrObject(422, err.message))
    //     }else{
    //       item.forEach( user => {
    //        const a = updateOneClient(model, {_id:user._id},{box:req[0]});
    //        qq.push(a)
    //       }) 
      
    //       Promise.all(qq).then(p => resolve(true))
    //     }
    
    //   })
    // })
  },
  

  /**
   * Updates an item in database by id
   * @param {string} id - item id
   * @param {Object} req - request object
   */
  async updateItem(id, model, req) {
  
    return new Promise((resolve, reject) => {
      model.findByIdAndUpdate(
        id,
        req,
        {
          new: true,
          runValidators: true
        },
        (err, item) => {
          itemNotFound(err, item, reject, 'NOT_FOUND')
          resolve(item)
        }
      )
    })
  },

  /**
   * Deletes an item from database by id
   * @param {string} id - id of item
   */
  async deleteItem(id, model) {
    return new Promise((resolve, reject) => {
      model.findByIdAndRemove(id, (err, item) => {
        itemNotFound(err, item, reject, 'NOT_FOUND')
        resolve(buildSuccObject('DELETED'))
      })
    })
  }
}
