<template lang="pug">
#user-nag-area
  h3.title.is-3 Almost done! Choose your username, {{newUserAttributes.uid}}

  p
   b Username:&nbsp;
   | this will appear in the URL bar and on all project pages.
  input.input(type="text" v-model="nameInput" placeholder="Username, no special characters")
  ul.errors
    li.error(v-show="!validation.name") Cannot be empty.
    li.error(v-show="validation.taken") Already taken.
    li.ok(v-show="validation.available") Username available!

  p(style="margin-top: 0.75rem;")
   b Full name:&nbsp;
   | so people can identify you.
  input.input(type="text" v-model="details" placeholder="Full name")

  button.button.is-link.is-rounded.account-button(
    :class="{'is-loading': isChecking}"
    :disabled="!validation.available"
    @click="saveUser") Save Details

</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import * as firebase from 'firebase/app'
import 'firebase/firestore'
import FireBaseAPI from '../communication/FireBaseAPI'
import debounce from 'debounce'

import CloudAPI from '@/communication/FireBaseAPI'
import sharedStore from '@/SharedStore'
import AuthenticationStore from '@/auth/AuthenticationStore.ts'

@Component
export default class AccountPanel extends Vue {
  private isChecking = false
  private nameInput = ''
  private details = ''
  private validation = { name: false, taken: false, available: false }

  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore
  private authState = this.authStore.state

  private dbCheck = debounce(this.isNameUnique, 500)

  private newUserAttributes = {
    uid: '',
    details: '',
    isgroup: false,
    notes: '',
  }

  private mounted() {
    this.newUserAttributes.uid = this.authState.idToken.sub
  }

  private async saveUser() {
    console.log({ SaveUser: this.nameInput })
    this.isChecking = true

    this.newUserAttributes.details = this.details

    try {
      // update existing user record
      await CloudAPI.updateDoc(`users/${this.nameInput}`, this.newUserAttributes)
    } catch (e) {
      // no record yet, create one
      await CloudAPI.createDoc(`users/${this.nameInput}`, this.newUserAttributes)
    }
    console.log('DONE')
    this.isChecking = false
    sharedStore.setCurrentUser(this.nameInput)
    sharedStore.setNagUserToLogin(false)
  }

  private async isNameUnique(name: string) {
    if (!name.trim()) return false

    this.isChecking = true
    const db = firebase.firestore()
    const userDoc = await db
      .collection('users')
      .doc(name)
      .get()

    this.isChecking = false

    if (userDoc.exists) {
      // user exists!
      console.log(name, 'exists!')
      this.validation.taken = true
      return false
    } else {
      // no such user yet!
      console.log(name, 'does not exists!')
      this.validation.taken = false
      this.validation.available = true
      return true
    }
  }

  @Watch('nameInput')
  private async validateName() {
    this.validation.available = false
    const unique = await this.dbCheck(this.nameInput)
    this.validation.name = !!this.nameInput.trim()
  }
}
</script>

<style scoped>
#user-nag-area {
  padding: 2rem 2rem;
  background-color: #ed7;
  display: flex;
  flex-direction: column;
  animation: 0.3s ease 0s 1 slideInFromTop;
}

.space {
  margin-right: 1rem;
}

.username-entry {
  margin-right: 1rem;
}

.account-details {
  margin-top: 3rem;
}

.row {
  padding-top: 1rem;
  display: flex;
  flex-direction: row;
}

.choose-username {
  margin-top: 2rem;
}

.title-strip {
  padding: 2rem 2rem;
  background-color: #f4f4f4;
}

.errors {
  display: flex;
  flex-direction: row;
  font-size: 0.9rem;
  height: 1.5rem;
  padding-left: 0.1rem;
}

.error {
  margin-right: 1rem;
  color: #900;
}

.ok {
  color: #00f;
}

.account-button {
  margin: 1rem auto 0rem 0rem;
}

.input {
  width: 300px;
  margin-right: auto;
}

@keyframes slideInFromTop {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideOutToTop {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-100%);
    opacity: 0;
  }
}

@media only screen and (max-width: 640px) {
  .title-strip {
    padding: 1.5rem 1rem 2rem 1rem;
  }

  .content-area {
    margin: 2rem 1rem;
  }
}
</style>
