const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const slug = require('slug');

const CategorySchema = new mongoose.Schema({
    slug: {type: String, lowercase: true, unique: true},
    name: String,
    description: String,
    parentCategory: {type: mongoose.Schema.Types.ObjectId, ref: 'Category'},
    childrenCategories: [{type: mongoose.Schema.Types.ObjectId, ref: 'Category'}]
});

CategorySchema.plugin(uniqueValidator, {message: 'is already taken'});

CategorySchema.pre('validate', function (next) {
    this.slugify();

    next();
});

CategorySchema.methods.slugify = function () {
    this.slug = slug(this.name);
};

CategorySchema.methods.toJSONFor = function () {
    return {
        slug: this.slug,
        name: this.name,
        description: this.description
    };
};

CategorySchema.methods.toJSONForHeader = function () {
    return {
        slug: this.slug,
        name: this.name,
        description: this.description,
        childrenCategories: this.childrenCategories
    };
};

mongoose.model('Category', CategorySchema);
