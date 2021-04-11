var mongoose = require('mongoose');
var Schema = mongoose.Schema;


mongoose.Promise = global.Promise;

//connect method
//mongoose.connect(process.env.DB, { useNewUrlParser: true });
try {
    mongoose.connect( process.env.MONGODB_URI, () =>
        console.log("connected"));
}catch (error) {
    console.log("could not connect");
}
mongoose.set('useCreateIndex', true);


var ReviewSchema = new Schema({
    name: {type: String},
    title: { type: String},
    quote: {type: String},
    rating: {type: "number"}
});



//return the model to server
module.exports = mongoose.model('Review', ReviewSchema);