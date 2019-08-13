import firebase from 'firebase/app'
import 'firebase/firestore'

export interface ProjectAttributes {
  owner: string
  title: string
  urlslug: string
  description: string
  public?: boolean
  mvizkey?: string
  imported?: boolean
}

export interface RunAttributes {
  owner: string
  project: string
  runId: string
  description: string
  public?: boolean
}

export interface FileAttributes {
  owner: string
  project: string
  runId: string
  filename: string
  sizeinbytes?: number
  mvizkey?: string
}

export interface VizAttributes {
  id: string
  title: string
  owner: string
  project: string
  runId: string
}

export default class FireBaseAPI {
  private static theCurrentUser: string = ''

  public static setCurrentUser(userId: string) {
    console.log('--> setting current user to:', userId)
    FireBaseAPI.theCurrentUser = userId
  }

  public static async getCurrentUser() {
    if (FireBaseAPI.theCurrentUser) return this.theCurrentUser
    return ''
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
    const docs = await db
      .collection('users')
      .doc(owner)
      .collection('projects')
      .get()

    const projects: any[] = []
    docs.forEach(project => {
      projects.push(project.data())
    })

    return projects
  }

  public static async getProject(owner: string, projectId: string) {
    console.log('getProject', owner, projectId)

    const db = firebase.firestore()
    const project = await db.doc(`users/${owner}/projects/${projectId}`).get()

    console.log({ getproject: project.data() })
    return project.data()
  }

  public static async createProject(props: ProjectAttributes) {
    console.log({ createProject: props })

    if (!props.public) props.public = false

    const db = firebase.firestore()
    await db.doc(`users/${props.owner}/projects/${props.urlslug}`).set(props)
  }

  public static async getRun(owner: string, projectId: string, runId: string) {
    console.log('getRun', owner, projectId, runId)

    const db = firebase.firestore()
    const run = await db.doc(`users/${owner}/projects/${projectId}/runs/${runId}`).get()

    return run.data()
  }

  public static async getRuns(owner: string, projectId: string) {
    console.log('getRuns', owner, projectId)

    const db = firebase.firestore()
    const docs = await db
      .collection('users')
      .doc(owner)
      .collection('projects')
      .doc(projectId)
      .collection('runs')
      .get()

    const runs: any[] = []
    docs.forEach(doc => {
      runs.push(doc.data())
    })

    return runs
  }

  public static async getFiles(owner: string, projectId: string, run: string) {
    console.log('getFiles', owner, projectId, run)

    const db = firebase.firestore()
    const docs = await db
      .collection('users')
      .doc(owner)
      .collection('projects')
      .doc(projectId)
      .collection('runs')
      .doc(run)
      .collection('files')
      .get()

    const files: any[] = []
    docs.forEach(doc => {
      files.push(doc.data())
    })

    return files
  }

  public static async createRun(props: RunAttributes) {
    console.log({ createRun: props })

    if (!props.public) props.public = false

    const db = firebase.firestore()
    await db.doc(`users/${props.owner}/projects/${props.project}/runs/${props.runId}`).set(props)
  }

  public static async addFiles(files: FileAttributes[]) {
    const db = firebase.firestore()

    const batch = db.batch()
    for (const props of files) {
      const location = `users/${props.owner}/projects/${props.project}/runs/${props.runId}/files/${props.filename}`
      console.log({ location })
      const doc = db.doc(location)
      batch.set(doc, props)
    }
    await batch.commit()
  }

  public static async updateDoc(location: string, attributes: any) {
    const db = firebase.firestore()
    const doc = db.doc(location)
    await doc.update(attributes)
  }

  public static async createDoc(location: string, attributes: any) {
    const db = firebase.firestore()
    await db.doc(location).set(attributes)
  }

  public static async addVisualizations(visualizations: VizAttributes[]) {
    const db = firebase.firestore()

    const batch = db.batch()
    for (const props of visualizations) {
      const location = `users/${props.owner}/projects/${props.project}/runs/${props.runId}/visualizations/${props.id}`
      console.log({ location })
      const doc = db.doc(location)
      batch.set(doc, props)
    }
    await batch.commit()
  }

  public static async getVisualizations(owner: string, projectId: string, run: string) {
    console.log('getVisualizations', owner, projectId, run)

    const db = firebase.firestore()
    const docs = await db
      .collection('users')
      .doc(owner)
      .collection('projects')
      .doc(projectId)
      .collection('runs')
      .doc(run)
      .collection('visualizations')
      .get()

    const data: any[] = []
    docs.forEach(doc => {
      data.push(doc.data())
    })

    return data
  }
}
