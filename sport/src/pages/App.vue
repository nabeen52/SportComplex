<script setup>

import HelloWorld from '../components/HelloWorld.vue'
import TheWelcome from '../components/TheWelcome.vue'
import Home_user from './home_user.vue';


</script>

<template>
  <!-- หัว -->
  <header>
    
    <!-- <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />
    </div> -->

  </header>


<!-- main -->
  <main>
    <!-- <Home_user/> -->
    <router-view />
  </main>
</template>


