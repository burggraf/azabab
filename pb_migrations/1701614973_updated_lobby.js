/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("fdqy49fsc4sfs6w")

  collection.indexes = [
    "CREATE UNIQUE INDEX `idx_ye7rxky` ON `lobby` (`user`)"
  ]

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("fdqy49fsc4sfs6w")

  collection.indexes = []

  return dao.saveCollection(collection)
})
