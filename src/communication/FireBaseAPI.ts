import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'

interface ProjectAttributes {
  owner: string
  title: string
  urlslug: string
  description: string
  public?: boolean
}

export default class FireBaseAPI {
  private static theCurrentUser: string = ''

  public static async getCurrentUser() {
    if (FireBaseAPI.theCurrentUser) return this.theCurrentUser

    const currentUser = firebase.auth().currentUser
    console.log({ currentUser })
    if (!currentUser) return ''

    const db = firebase.firestore()
    const results = await db
      .collection('users')
      .where('uid', '==', currentUser.uid)
      .get()

    console.log(results.size)
    if (results.size) {
      results.forEach(doc => {
        // user exists!
        const foundUser = doc.data()
        console.log({ foundUser })
        FireBaseAPI.theCurrentUser = foundUser.urlslug
      })
      return FireBaseAPI.theCurrentUser
    } else {
      // no such user yet!
    }
    return ''
  }

  public static async logout() {
    const user = firebase.auth().currentUser
    if (user) {
      firebase
        .auth()
        .signOut()
        .then(() => {
          // sign out successful
          console.log('logged out')
          FireBaseAPI.theCurrentUser = ''
          return true
        })
        .catch(e => {
          // failed
          console.error(e)
          return false
        })
    }
    return false
  }

  public static async canUserModify(ownerId: string) {
    console.log('canUserModify', ownerId)

    const currentUser = await FireBaseAPI.getCurrentUser()
    console.log({ currentUser })

    // not logged in?
    if (!currentUser) return false

    // is it me?
    if (currentUser === ownerId) return true

    // not a team?
    const ownerDetails: any = await FireBaseAPI.getOwner(ownerId)
    if (!ownerDetails.isgroup) return false

    // am I on the team list?
    if (ownerDetails.members && ownerDetails.members.indexOf(currentUser) > -1) return true

    return false
  }

  public static async getOwner(owner: string) {
    console.log('getOwner', owner)
    const db = firebase.firestore()
    const user = await db
      .collection('users')
      .doc(owner)
      .get()

    return user.data()
  }

  public static async getProjectsForUser(owner: string) {
    console.log('getProjectsForUser', owner)
    const db = firebase.firestore()
    const query = await db
      .collection('projects')
      .where('owner', '==', owner)
      .get()

    const result: any = []
    query.forEach(doc => {
      result.push(doc.data())
    })

    return result
  }

  public static async getProject(owner: string, urlslug: string) {
    console.log('getProject', owner, urlslug)

    const db = firebase.firestore()
    const query = await db
      .collection('projects')
      .where('owner', '==', owner)
      .where('urlslug', '==', urlslug)
      .get()

    const result: any = []
    query.forEach(doc => {
      result.push(doc.data())
    })
    return result
  }

  public static async createProject(props: ProjectAttributes) {
    console.log({ createProject: props })

    if (!props.public) props.public = false

    const db = firebase.firestore()
    await db
      .collection('projects')
      .doc()
      .set(props)
  }
}
