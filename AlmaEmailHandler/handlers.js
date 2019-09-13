const alma = require ('almarestapi-lib');

exports.user = async (inst, id, email) => {
  // Get user, add note, update user
  var path = `/users/${id}`;
  var user = await alma.getp(path);
  user.user_role = null;
  user.user_note.push({note_text: email.visibleText, note_type: {value: 'OTHER'}});
  await alma.putp(path, user);
}