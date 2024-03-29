const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const slug = require('slug');
const User = mongoose.model('User');

const ArticleSchema = new mongoose.Schema({
    slug: {type: String, lowercase: true, unique: true},
    title: String,
    description: String,
    published: Boolean,
    image: String,
    body: String,
    imageWidth: String,
    imageHeight: String,
    tagList: [{type: String}],
    categories: [{type: mongoose.Schema.Types.ObjectId, ref: 'Category'}],
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
}, {timestamps: true});

ArticleSchema.plugin(uniqueValidator, {message: 'is already taken'});

ArticleSchema.pre('validate', function (next) {
    this.slugify();

    next();
});

ArticleSchema.methods.slugify = function () {
    this.slug = slug(this.title);
};

ArticleSchema.methods.toJSONFor = function (user) {
    return {
        slug: this.slug,
        title: this.title,
        description: this.description,
        published: this.published,
        body: this.body,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        tagList: this.tagList,
        image: this.image,
        imageWidth: this.imageWidth,
        imageHeight: this.imageHeight,
        categories: this.categories.map(function (category) {
                return {
                    slug: category.slug,
                    name: category.name
                }
        }),
        author: this.author.toProfileJSONFor(user)
    };
};

mongoose.model('Article', ArticleSchema);
