var test = require('tape')
var hyperkv = require('../')
var memdb = require('memdb')
var hyperlog = require('hyperlog')
var sub = require('subleveldown')

test('live - with old', function (t) {
  t.plan(6)
  var db = memdb()
  var kv = hyperkv({
    log: hyperlog(sub(db, 'log'), { valueEncoding: 'json' }),
    db: sub(db, 'kv')
  })

  kv.put('A', 555, function (err, node) {
    t.ifError(err)
    kv.put('B', 555, function (err, node) {
      t.ifError(err)
      var results = []
      kv.createReadStream({ live: true, old: true })
        .on('data', function (data) {
          t.ok(data.key === 'A' || data.key === 'B' || data.key === 'C')
          results.push(data.key)

          if (results.length === 2) {
            kv.put('C', 555, function (err, node) {
              t.ifError(err)
            })
          }
        })
    })
  })
})

test('live - only new', function (t) {
  t.plan(3)
  var db = memdb()
  var kv = hyperkv({
    log: hyperlog(sub(db, 'log'), { valueEncoding: 'json' }),
    db: sub(db, 'kv')
  })

  kv.put('A', 555, function (err, node) {
    t.ifError(err)
    kv.put('B', 555, function (err, node) {
      t.ifError(err)

      kv.createReadStream({ live: true, old: false })
        .on('data', function (data) {
          t.equal(data.key, 'C', 'New entry')
        })

      kv.put('C', 555)
    })
  })
})
