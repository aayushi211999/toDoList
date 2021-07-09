const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

// let items = ["Buy Shoes", "Laundry", "Dishes"];
// let workItems = [];
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () =>{
    console.log("Database connected");
});

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome"
});
const item2 = new Item({
    name: "Hi"
});
const item3 = new Item({
    name: "Hello"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name : String,
    items : [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/",function(req, res){

    Item.find({}, function(err, foundItems){
        if (foundItems.length === 0){
            Item.insertMany(defaultItems, function(err){
                if(err)
                    console.log(err);
                else
                    console.log("Items inserted Sucessfully");
            });
            res.redirect("/");
        }
        else{
        res.render("list", {
            listTitle: "Today",
            newListItems: foundItems
        });
    }
    });
    
});

app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName}, function(err, foundList){
        if(!err){
            if(!foundList){
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
            
                list.save();
                res.redirect("/" + customListName);
            }
                
            else{
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                });
            }
            
        }
    });

    
});

app.post("/",function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName === "Today"){
        item.save()
        res.redirect("/");
    }
    else{
        List.findOne({name: listName},function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+ listName);
        });
    }   
});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    
     if(listName === "Today")
    {
        Item.findByIdAndRemove(checkedItemId, function(err){
            if(err)
                console.log(err);
            else{
                console.log("Item deleted sucessfully.");
                res.redirect("/");
            }
        });
    }
    else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
            if(!err)
                res.redirect("/"+listName);
        });
    }

});

app.get("/work",function(req, res){
    res.render("list", {listTitle: "Things to do!!!", newListItems: workItems});
});

app.get("/about",function(req, res){
    res.render("about");
});

app.post("/button",function(req, res){
    res.redirect("/about");
});
app.listen(3030, function(){
    console.log("Listening to port 8080");
});
