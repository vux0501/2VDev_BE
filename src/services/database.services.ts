import { Collection, Db, MongoClient } from 'mongodb'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Post from '~/models/schemas/Post.schema'
import Hashtag from '~/models/schemas/Hashtag.schema'
import Bookmark from '~/models/schemas/Bookmark.schema'
import Vote from '~/models/schemas/Vote.schema'
import ReportPost from '~/models/schemas/Report.schema'
import Follower from '~/models/schemas/Follower.schema'
import { envConfig } from '~/constants/config'

const uri = `mongodb+srv://${envConfig.dbUsername}:${envConfig.dbPassword}@cluster0.7kmsofb.mongodb.net/?retryWrites=true&w=majority`

class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(envConfig.dbName)
  }
  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async indexUsers() {
    const exists = await this.users.indexExists([
      'email_1_password_1',
      'email_1',
      'username_1',
      'username_text_name_text'
    ])

    if (!exists) {
      this.users.createIndex({ email: 1, password: 1 })
      this.users.createIndex({ email: 1 }, { unique: true })
      this.users.createIndex({ username: 1 }, { unique: true })
      this.users.createIndex({ username: 'text', name: 'text' }, { default_language: 'none' })
    }
  }
  async indexRefreshTokens() {
    const exists = await this.refreshTokens.indexExists(['exp_1', 'token_1'])

    if (!exists) {
      this.refreshTokens.createIndex({ token: 1 })
      this.refreshTokens.createIndex(
        { exp: 1 },
        {
          expireAfterSeconds: 0
        }
      )
    }
  }

  async indexFollowers() {
    const exists = await this.followers.indexExists(['user_id_1_followed_user_id_1'])
    if (!exists) {
      this.followers.createIndex({ user_id: 1, followed_user_id: 1 })
    }
  }

  async indexPosts() {
    const exists = await this.posts.indexExists(['content_text_title_text'])
    if (!exists) {
      this.posts.createIndex({ content: 'text', title: 'text' }, { default_language: 'none' })
    }
  }

  get users(): Collection<User> {
    return this.db.collection(envConfig.dbUsersCollection)
  }
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(envConfig.dbRefreshTokensCollection)
  }
  get posts(): Collection<Post> {
    return this.db.collection(envConfig.dbPostsCollection)
  }
  get hashtags(): Collection<Hashtag> {
    return this.db.collection(envConfig.dbHashtagsCollection)
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(envConfig.dbBookmarksCollection)
  }
  get votes(): Collection<Vote> {
    return this.db.collection(envConfig.dbVotesCollection)
  }
  get reports(): Collection<ReportPost> {
    return this.db.collection(envConfig.dbReportsCollection)
  }
  get followers(): Collection<Follower> {
    return this.db.collection(envConfig.dbFollowersCollection)
  }
}

//Tạo object từ class Data
const databaseService = new DatabaseService()
export default databaseService
