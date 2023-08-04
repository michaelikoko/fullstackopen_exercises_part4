const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const middleware = require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
    response.json(blogs)
})

blogsRouter.get('/:id', async (request, response) => {
    const blog = await Blog.findById(request.params.id).populate('user', { username: 1, name: 1 })
    if (blog) {
        response.json(blog)
    } else {
        response.status(404).end()
    }
})

blogsRouter.post('/', middleware.userExtractor, async (request, response) => {
    const body = request.body
    const user = request.user

    const blog = new Blog({
        'title': body.title,
        'author': body.author,
        'url': body.url,
        'likes': body.likes || 0,
        'user': user.id
    })

    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    const populatedBlog = await savedBlog.populate('user', { username: 1, name: 1 })
    response.status(201).json(populatedBlog)
})

blogsRouter.delete('/:id', middleware.userExtractor, async (request, response) => {
    const user = request.user
    const blog = await Blog.findById(request.params.id)

    if (blog === null) {
        response.status(404).end()
    }

    if (blog.user.toString() === user.id.toString()) {
        await Blog.findByIdAndRemove(request.params.id)
        response.status(204).end()
    }
    response.status(401).end()

})

blogsRouter.put('/:id', async (request, response) => {
    const body = request.body
    const blog = await Blog.findById(request.params.id)

    if (blog === null) {
        response.status(404).end()
    }

    const blogObject = {
        'title': body.title,
        'author': body.author,
        'url': body.url,
        'likes': body.likes,
        'user': body.user
    }

    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blogObject, { new: true })
    const populatedBlog = await updatedBlog.populate('user', { username: 1, name: 1 })
    response.json(populatedBlog)
})

module.exports = blogsRouter