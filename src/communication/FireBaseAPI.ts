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
