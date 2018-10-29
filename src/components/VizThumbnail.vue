<template lang="pug">
.card
  .card-image
    img.img-responsive(src="@/assets/transit-supply.jpg")
  .card-content
    .card-title
      slot(name="title")
    .card-subtitle
      slot(name="content")
</template>

<style scoped>
.listItem {
  display: flex;
  flex-direction: row;
  padding: 0rem 0.25rem 0rem 0.25rem;
  border-bottom: 1px solid lightgray;
}

.listItem:hover {
  background-color: rgb(240, 240, 240);
}

.clickContent {
  flex: 1;
  background-color: transparent;
  border: none;
  font-family: inherit;
  padding: 0;
  margin: 0;
  text-align: inherit;
  font-size: inherit;
  cursor: pointer;
  padding: 1rem 1rem 1rem 0;
  transition-duration: 0.25s;
}

.title {
  font-weight: bold;
}

.main {
  font-weight: lighter;
  color: gray;
}

.accessory {
  display: flex;
  align-items: center;
}

/***
* Cards
*/
.card .card-image {
  overflow: hidden;
}

.card:hover {
  box-shadow: 0 2px 7px 0 rgba(0, 0, 0, 0.5);
  -webkit-box-shadow: 4 2px 7px 0 rgba(0, 0, 0, 0.5);
  -moz-box-shadow: 4 2px 7px 0 rgba(0, 0, 0, 0.5);
}

.card {
  margin: 20px 20px 20px 0px;
  position: relative;
  -webkit-box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.16), 0 2px 10px 0 rgba(0, 0, 0, 0.12);
  -moz-box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.16), 0 2px 10px 0 rgba(0, 0, 0, 0.12);
  box-shadow: 4 2px 5px 0 rgba(0, 0, 0, 0.16), 0 2px 10px 0 rgba(0, 0, 0, 0.12);
}

.card .card-content {
  padding: 10px;
}

.card .card-content .card-title {
  display: block;
  font-size: 18px;
  font-weight: bold;
}

.card .card-content .card-subtitle {
  display: block;
  font-size: 13px;
}

.card .card-action {
  padding: 20px;
  border-top: 1px solid rgba(160, 160, 160, 0.2);
}

.card .card-action a {
  font-size: 15px;
  text-transform: uppercase;
  margin-right: 20px;
}

.card .card-action a:hover {
  text-decoration: none;
}
</style>
