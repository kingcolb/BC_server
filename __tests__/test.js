const {app, BC_userData } = require('../')
const request = require("supertest")

const cases = [
  {
    description: "Add three roles",
    newRoles:  ['001 - Admin', '002 - Clinical Personnel',  '003 - Warehouse Personnel'],
    expected: {
      added_roles: ['BC_ADMIN', 'BC_CLINICAL', 'BC_WAREHOUSE'],
      deleted_roles: [],
      unchanged_roles: [],
      current_DB_roles: ['BC_ADMIN', 'BC_CLINICAL', 'BC_WAREHOUSE']
    }
  },
  {
    description: "Delete one role",
    newRoles: ['001 - Admin', '002 - Clinical Personnel'],
    expected: {
      added_roles: [],
      deleted_roles: ['BC_WAREHOUSE'],
      unchanged_roles: ['BC_ADMIN', 'BC_CLINICAL'],
      current_DB_roles: ['BC_ADMIN', 'BC_CLINICAL']
    }
  },
  {
    description: 'Delete two roles',
    newRoles: [],
    expected: {
      added_roles: [],
      deleted_roles: ['BC_ADMIN', 'BC_CLINICAL'],
      unchanged_roles: [],
      current_DB_roles: []
    }
  },
  {
    description: 'Add two roles',
    newRoles: ['002 - Clinical Personnel',  '003 - Warehouse Personnel'],
    expected: {
      added_roles: ['BC_CLINICAL', 'BC_WAREHOUSE'],
      deleted_roles: [],
      unchanged_roles: [],
      current_DB_roles: ['BC_CLINICAL', 'BC_WAREHOUSE']
    }
  },
  {
    description: 'Add one role and delete one role',
    newRoles: ['001 - Admin',  '003 - Warehouse Personnel'],
    expected: {
      added_roles: ['BC_ADMIN'],
      deleted_roles: ['BC_CLINICAL'],
      unchanged_roles: ['BC_WAREHOUSE'],
      current_DB_roles: ['BC_ADMIN', 'BC_WAREHOUSE']
    }
  },
  {
    description: 'Delete two roles and add one role',
    newRoles: ['002 - Clinical Personnel'],
    expected: {
      added_roles: ['BC_CLINICAL'],
      deleted_roles: ['BC_ADMIN', 'BC_WAREHOUSE'],
      unchanged_roles: [],
      current_DB_roles: ['BC_CLINICAL']
    }
  },
  {
    description: 'Delete one role and add two roles',
    newRoles: ['001 - Admin',  '003 - Warehouse Personnel'],
    expected: {
      added_roles: ['BC_ADMIN', 'BC_WAREHOUSE'],
      deleted_roles: ['BC_CLINICAL'],
      unchanged_roles: [],
      current_DB_roles:  ['BC_ADMIN', 'BC_WAREHOUSE']
    }
  },
  {
    description: 'Unmodify roles',
    newRoles: ['001 - Admin',  '003 - Warehouse Personnel'],
    expected: {
      added_roles: [],
      deleted_roles: [],
      unchanged_roles: ['BC_ADMIN', 'BC_WAREHOUSE'],
      current_DB_roles:  ['BC_ADMIN', 'BC_WAREHOUSE']
    }
  },
  {
    description: 'Handle duplicate roles',
    newRoles: ['001 - Admin',  '003 - Warehouse Personnel', '001 - Admin',  '003 - Warehouse Personnel'],
    expected: {
      added_roles: [],
      deleted_roles: [],
      unchanged_roles: ['BC_ADMIN', 'BC_WAREHOUSE'],
      current_DB_roles:  ['BC_ADMIN', 'BC_WAREHOUSE']
    }
  },
]

describe("Server tests", () => {

    describe("POST update roles request", () => {
      const post = async (payload) => await request(app)
              .post("/update_roles")
              .send(payload)
              .set('Content-Type', 'application/json')
              .set('Accept', 'application/json')
      describe("Normal use case of roles updating", () => {
        for (const i of cases) {
          it(i.description, async () => {
            const payload = {userId: '257684345692', roles: i.newRoles}
            
            const res = await post(payload)
            expect(res.statusCode).toBe(200)
            expect(res.body.added_roles.sort()).toEqual(i.expected.added_roles.sort())
            expect(res.body.deleted_roles.sort()).toEqual(i.expected.deleted_roles.sort())
            expect(res.body.unchanged_roles.sort()).toEqual(i.expected.unchanged_roles.sort())
            expect(BC_userData['257684345692'].sort()).toEqual(i.expected.current_DB_roles.sort())
          })
        }

        it("Should be able to add multiple users to the server", async() => {
          const payload1 = {userId: '257684345692', roles: []}
          const payload2 = {userId: '835657474746', roles: []}

          await post(payload1)
          await post(payload2)
          expect(Object.keys(BC_userData).sort()).toEqual([payload1.userId, payload2.userId].sort())
        })

        it("Should correctly modify the user's data based on id", async() => {
          const payload2 = {userId: '835657474746', roles: ['001 - Admin']}
          await post(payload2)
          expect(BC_userData['835657474746']).toEqual(['BC_ADMIN'])
        })
      })



      describe("Exceptions", () => {
        it("Should throw on missing user id", async () => {
          const payload = {roles: []}
          const res = await post(payload)
          expect(res.statusCode).toBe(400)
          expect(res.body.errors.some(e => e.msg === "UserId is missing")).toBe(true)
          
        })
        //it("Should handle non-string user id", async() => {

        //})
        it("Should throw on missing roles parameter", async() => {
          const payload = {userId: "382563285125"}
          const res = await post(payload)
          expect(res.statusCode).toBe(400)
          expect(res.body.errors.some(e => e.msg === "Roles parameter is missing")).toBe(true)
        })

        it("Should throw on non-array roles parameter", async() => {
          const payload = {userId: "382563285125", roles: {}}
          const res = await post(payload)
          expect(res.statusCode).toBe(400)
          expect(res.body.errors.some(e => e.msg === "Roles must be an array with max 10 elements")).toBe(true)
        })
        
       
        it("Should throw if roles parameter contains other values than strings", async () => {
          const payload = {userId: "382563285125", roles: [123, 124]}
          const res = await post(payload)
          expect(res.statusCode).toBe(400)
          expect(res.body.errors.some(e => e.msg === "Roles must be an array of strings of Azure AD roles")).toBe(true)
          
        })        
      })

    
     

    })
  })

 




