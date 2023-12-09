/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("71ig7iys6y512y4")

  collection.listRule = ""
  collection.viewRule = ""
  collection.createRule = "user = user.id"
  collection.updateRule = "user = user.id"
  collection.deleteRule = "user = user.id"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("71ig7iys6y512y4")

  collection.listRule = null
  collection.viewRule = null
  collection.createRule = null
  collection.updateRule = null
  collection.deleteRule = null

  return dao.saveCollection(collection)
})
