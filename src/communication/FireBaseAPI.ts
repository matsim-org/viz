import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'

export default class FireBaseAPI {
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

  public static async getProject(owner: string, projectShortName: string) {
    console.log('getProject', owner, projectShortName)

    const db = firebase.firestore()
    const query = await db
      .collection('projects')
      .where('owner', '==', owner)
      .where('shortname', '==', projectShortName)
      .get()

    const result: any = []
    query.forEach(doc => {
      result.push(doc.data())
    })
    return result
  }
}
