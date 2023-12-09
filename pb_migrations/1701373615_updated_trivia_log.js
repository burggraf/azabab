/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("sqbdhmue1iaanpu")

  collection.viewRule = "user.id = user"
  collection.createRule = "user.id = user"
  collection.updateRule = "user.id = user"
  collection.deleteRule = "user.id = user"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("sqbdhmue1iaanpu")

  collection.viewRule = null
  collection.createRule = null
  collection.updateRule = null
  collection.deleteRule = null

  return dao.saveCollection(collection)
})
