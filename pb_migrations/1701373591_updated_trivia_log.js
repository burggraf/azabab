/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("sqbdhmue1iaanpu")

  collection.listRule = "user.id = user"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("sqbdhmue1iaanpu")

  collection.listRule = null

  return dao.saveCollection(collection)
})
