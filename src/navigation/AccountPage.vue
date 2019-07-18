<template lang="pug">
#page
  .title-strip
    .account-area(v-if="loggedIn")
      button.button.right.is-rounded.is-danger.is-outlined(style="float:right;" v-if="loggedIn" @click="logout()") Logout
      h3.title.is-3(v-if="account") Account Page -&nbsp;
          router-link(:to="'/' + account") {{account}}
      h3.title.is-3(v-else) Almost there! Create a username.

    h4.title.is-4(v-else) Sign into MatHub to access your account.

  .content-area
    .login-area(v-if="!loggedIn")
      #firebaseui-auth-container

    .choose-username(v-if="mustChooseName")
      h5 Next, choose a unique username.
      p This will be shown in the URL bar for your personal page and on all of your dashboards.
      .row
        input.input.username-entry(v-model="nameInput")
        button.button.is-link.is-rounded.space(:disabled="!nameInput" @click="trySavingName") Create

      .row(v-if="isChecking")
        p Checking...&nbsp;&nbsp;

      .row(v-if="isAvailable")
        p Username available. &nbsp;&nbsp;
          i.fa.fa-lg.fa-check(v-if="isAvailable" style="color: #5c5" aria-hidden="true")

      .row(v-if="isTaken")
        p Name taken, try again...&nbsp;&nbsp;
          i.fa.fa-lg.fa-times(v-if="isTaken" style="color: #a00" aria-hidden="true")

    .account-details(v-if="loggedIn && !mustChooseName")
      p: b User-level settings will go here.
      br
      p
        b User:&nbsp;
        | {{account}}

      p
        b Member of: ...

</template>

<script lang="ts">
import sharedStore from '@/SharedStore'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import * as firebaseui from 'firebaseui'
import 'firebaseui/dist/firebaseui.css'
import FireBaseAPI from '../communication/FireBaseAPI'

@Component
export default class AccountPage extends Vue {
  private loggedIn: boolean = false
  private account: string = ''
  private mustChooseName: boolean = false
  private isAvailable: boolean = false
  private isTaken: boolean = false
  private isChecking: boolean = false
  private nameInput: string = ''
  private userID: string = ''
  private details: string = ''

  public created() {}

  public async mounted() {
    const parent = this
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        parent.loggedIn = true

        console.log('auth changed!')
        console.log({ user, userID: parent.userID })

        const db = firebase.firestore()
        const query = db
          .collection('users')
          .where('uid', '==', user.uid)
          .get()
          .then(results => {
            if (results.size) {
              results.forEach(doc => {
                // user exists!
                console.log({ doc })
                const foundUser = doc.data()
                console.log({ foundUser })
                parent.userID = foundUser.uid
                parent.account = foundUser.urlslug
              })
            } else {
              // no such user yet!
              parent.mustChooseName = true
              parent.userID = user.uid
              if (user.displayName) parent.details = user.displayName
            }
          })
          .catch(e => {
            console.log({ e })
          })

        // User is signed in.
      } else {
        // No user is signed in.
        parent.loggedIn = false
        parent.showLoginPanel()
      }
    })
  }

  private async trySavingName() {
    console.log(this.nameInput)
    this.isChecking = true
    const isUnique = await this.isNameUnique(this.nameInput)
    if (isUnique) {
      this.isChecking = false
      this.isAvailable = true
      this.isTaken = false

      const db = firebase.firestore()
      await db
        .collection('users')
        .doc(this.nameInput)
        .set({
          isgroup: false,
          uid: this.userID,
          details: this.details,
          urlslug: this.nameInput,
        })

      this.mustChooseName = false
      this.loggedIn = true
      this.account = this.nameInput
    }
  }

  private async isNameUnique(name: string) {
    const db = firebase.firestore()
    const userDoc = await db
      .collection('users')
      .doc(name)
      .get()

    if (userDoc.exists) {
      // user exists!
      return false
    } else {
      // no such user yet!
      return true
    }
  }

  private showLoginPanel() {
    const ui = new firebaseui.auth.AuthUI(firebase.auth())

    //    if (ui.isPendingRedirect()) {
    ui.start('#firebaseui-auth-container', {
      signInOptions: [
        {
          provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
          // signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
          requireDisplayName: true,
        },
        // firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      ],
    })
  }

  private async logout() {
    this.loggedIn = !(await FireBaseAPI.logout())
  }
}
</script>

<style scoped>
.content-area {
  background-color: #fff;
  padding: 0rem 2rem 2rem 2rem;
}

.login-area {
  margin: auto auto;
}

.space {
  margin-right: 1rem;
}

.username-entry {
  margin-right: 1rem;
  width: 20rem;
}

.account-details {
  margin-top: 3rem;
}

.row {
  padding-top: 1rem;
  display: flex;
  flex-direction: row;
}

a:hover {
  color: purple;
}

.choose-username {
  margin-top: 2rem;
}

.title-strip {
  padding: 2rem 2rem;
  background-color: #f4f4f4;
}
</style>
