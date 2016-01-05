/**
* AdPlaylist.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    slot: {
      model: 'adSlot',
      required: true
    },
    streamURL: {
      type: 'string',
      required: true
    },
    bandwidth: {
      type: 'integer',
      required: true
    }
  }

};
