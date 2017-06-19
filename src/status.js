'use strict'

const he = require('he')
const User = require('./user')
const Photo = require('./photo')

class Status {
  constructor (status) {
    this.created_at = status.created_at
    this.id = status.id
    this.rawid = status.rawid
    this.text = status.text
    this.source = status.source
    this.truncated = status.truncated
    this.in_reply_to_status_id = status.in_reply_to_status_id
    this.in_reply_to_user_id = status.in_reply_to_user_id
    this.favorited = status.favorited
    this.in_reply_to_screen_name = status.in_reply_to_screen_name
    this.is_self = status.is_self
    this.location = status.location
    if (status.hasOwnProperty('repost_status_id')) {
      this.repost_status_id = status.repost_status_id
    }
    if (status.hasOwnProperty('repost_user_id')) {
      this.repost_user_id = status.repost_user_id
    }
    if (status.hasOwnProperty('repost_screen_name')) {
      this.repost_screen_name = status.repost_screen_name
    }
    if (status.hasOwnProperty('repost_status')) {
      this.repost_status = new Status(status.repost_status)
    }
    this.user = new User(status.user)
    if (status.hasOwnProperty('photo')) {
      this.photo = new Photo(status.photo)
    }
    this.type = this._getType()
    this.source_url = this._getSourceUrl()
    this.source_name = this._getSourceName()
    this.txt = this._getTxt()
    this.plain_text = this._getPlainText()
  }

  isReply () {
    return this.in_reply_to_status_id !== '' || this.in_reply_to_user_id !== ''
  }

  isRepost () {
    return this.hasOwnProperty('repost_status_id') && this.repost_status_id !== ''
  }

  isOrigin () {
    return !(this.isReply() || this.isRepost())
  }

  isOriginRepost () {
    return this.isOrigin() && this.text.match(/转@/g)
  }

  _getType () {
    if (this.isReply()) return 'reply'
    if (this.isRepost()) return 'repost'
    if (this.isOrigin()) return 'origin'
    return 'unknown'
  }

  _getSourceUrl () {
    if (this.source.match(/<a href="(.+)" target="_blank">.+<\/a>/)) {
      return this.source.match(/<a href="(.+)" target="_blank">.+<\/a>/)[1]
    } else {
      return ''
    }
  }

  _getSourceName () {
    if (this.source.match(/<a href=".+" target="_blank">(.+)<\/a>/)) {
      return this.source.match(/<a href=".+" target="_blank">(.+)<\/a>/)[1]
    } else {
      return this.source
    }
  }

  _getTxt () {
    const pattern = /[@#]?<a href="(.*?)".*?>([\s\S\n]*?)<\/a>#?/g
    const match = this.text.match(pattern)
    const txt = []
    let theText = this.text
    if (match) {
      match.forEach(item => {
        const index = theText.indexOf(item)

        // text
        if (index > 0) {
          const text = theText.substr(0, index)
          const originText = he.decode(Status._removeBoldTag(theText.substr(0, index)))
          const thisTxt = {
            type: 'text',
            text: originText,
            _text: originText.replace(/\n{3,}/g, '\n\n')
          }
          if (Status._hasBold(text)) thisTxt.bold_arr = Status._getBoldArr(text)
          txt.push(thisTxt)
        }

        // tag
        if (item.substr(0, 1) === '#') {
          const matchText = item.match(/#<a href=".*?".?>([\s\S\n]*)<\/a>#/)
          const text = `#${matchText[1]}#`
          const originText = he.decode(Status._removeBoldTag(text))
          const thisTxt = {
            type: 'tag',
            text: originText,
            _text: originText.replace(/\n{2,}/g, '\n'),
            query: he.decode(matchText[1])
          }
          if (Status._hasBold(text)) thisTxt.bold_arr = Status._getBoldArr(text)
          txt.push(thisTxt)
        }

        // at
        if (item.substr(0, 1) === '@') {
          const matchText = item.match(/@<a href="http:\/\/fanfou.com\/(.*?)".*?>(.*?)<\/a>/)
          const text = `@${matchText[2]}`
          const originText = he.decode(Status._removeBoldTag(text))
          const thisTxt = {
            type: 'at',
            text: originText,
            name: he.decode(matchText[2]),
            id: matchText[1]
          }
          if (Status._hasBold(text)) thisTxt.bold_arr = Status._getBoldArr(text)
          txt.push(thisTxt)
        }

        // link
        if (item.substr(0, 1) === '<') {
          const matchText = item.match(/<a href="(.*?)".*?>(.*?)<\/a>/)
          const text = Status._removeBoldTag(matchText[2])
          const link = matchText[1]
          const thisTxt = {
            type: 'link',
            text: text,
            link: link
          }
          if (Status._hasBold(text)) thisTxt.bold_arr = Status._getBoldArr(text)
          txt.push(thisTxt)
        }
        theText = theText.substr(index + item.length)
      })
      if (theText.length) {
        const text = theText
        const originText = he.decode(Status._removeBoldTag(text))
        const thisTxt = {
          type: 'text',
          text: originText,
          _text: originText.replace(/\n{3,}/g, '\n\n')
        }
        if (Status._hasBold(text)) thisTxt.bold_arr = Status._getBoldArr(text)
        txt.push(thisTxt)
      }
      return txt
    } else {
      const text = theText
      const originText = he.decode(Status._removeBoldTag(theText))
      const thisTxt = {
        type: 'text',
        text: originText,
        _text: originText.replace(/\n{3,}/g, '\n\n')
      }
      if (Status._hasBold(text)) thisTxt.bold_arr = Status._getBoldArr(text)
      return [thisTxt]
    }
  }

  _getPlainText () {
    let text = ''
    this.txt.forEach(t => {
      text += t.text
    })
    return he.decode(text)
  }

  static _hasBold (text) {
    return text.match(/<b>[\s\S\n]*?<\/b>/g)
  }

  static _getBoldArr (text) {
    const pattern = /<b>[\s\S\n]*?<\/b>/g
    let theText = text
    const match = text.match(pattern)
    const textArr = []
    if (match) {
      match.forEach(item => {
        const index = theText.indexOf(item)
        if (index > 0) {
          const t = theText.substr(0, index)
          textArr.push({
            text: he.decode(t),
            bold: false
          })
        }
        const t = item.match(/<b>([\s\S\n]*?)<\/b>/)[1]
        textArr.push({
          text: he.decode(t),
          bold: true
        })
        theText = theText.substr(index + item.length)
      })
      if (theText.length) {
        textArr.push({
          text: he.decode(theText),
          bold: false
        })
      }
      return textArr
    } else {
      return [{
        text: he.decode(text),
        bold: false
      }]
    }
  }

  static _removeBoldTag (text) {
    return text.replace(/<b>/g, '').replace(/<\/b>/g, '')
  }
}

module.exports = Status
