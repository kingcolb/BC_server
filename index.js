const express = require('express')
const bodyParser = require('body-parser')
const { body, validationResult } = require('express-validator');
const app = express()


const azureToBCMap = {
    '001 - Admin' : 'BC_ADMIN',
    '002 - Clinical Personnel': 'BC_CLINICAL',
    '003 - Warehouse Personnel' : 'BC_WAREHOUSE'
}
let BC_userData = {}

const validation = [
    body('userId')
        .exists().withMessage("UserId is missing")
        .isLength({ min: 1, max: 20 }).withMessage("UserId must be between 1 and 20 characters")
        .isString().withMessage("UserId must be a string")
        .escape(),
    body('roles')
        .exists().withMessage("Roles parameter is missing")
        .notEmpty()
        .isArray({ min: 0, max: 10 }).withMessage('Roles must be an array with max 10 elements')
        .custom((value) => {
            for (const element of value) {
                if (typeof element !== 'string' || azureToBCMap[element] === undefined) {
                return false;
                }
            }
            return true;
        }).withMessage('Roles must be an array of strings of Azure AD roles')
        .escape()
]


app.use(bodyParser.json())



app.post('/update_roles', 
    validation,
(req, res) => {
  

  const validationResults = validationResult(req)  
  if (!validationResults.isEmpty()) {
    return res.status(400).json({errors: validationResults.array()});
  }
  const { userId, roles } = req.body

  const newBCRoles = new Set(roles.map(e => azureToBCMap[e]))           // Set to remove duplicate values

  let serverUserRoles = BC_userData[userId] || []

  const addedRoles = []
  let rolesToDelete = [...serverUserRoles]
  let unchangedRoles = []

  newBCRoles.forEach(role => {
    if (serverUserRoles.includes(role)) {
      unchangedRoles.push(role) 
      rolesToDelete = rolesToDelete.filter(r => r !== role)
    } else {
      serverUserRoles.push(role)
      addedRoles.push(role)
    }
  })

  rolesToDelete.forEach(role => {
    serverUserRoles = serverUserRoles.filter(r => r !== role)
  })

  BC_userData[userId] = serverUserRoles

  const response = {
    added_roles: addedRoles,
    deleted_roles: rolesToDelete,
    unchanged_roles: unchangedRoles,
  }

  res.json(response)
})

app.listen(3000, () => {
  console.log('Server started on port 3000')
})

module.exports =  {app, BC_userData}