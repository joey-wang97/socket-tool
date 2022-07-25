<template>
  <el-tabs v-model="activeTab">
    <el-tab-pane label="TCP/UDP Client" name="tcpClient"
      ><tcp-view
    /></el-tab-pane>
    <el-tab-pane label="TCP/UDP Server" name="tcpServer"
      ><tcp-view
    /></el-tab-pane>
    <el-tab-pane label="Serial" name="serial"><tcp-view /></el-tab-pane>
  </el-tabs>
</template>

<script setup>
import TcpView from "./views/TcpView.vue";
import { ref } from "vue";

const activeTab = ref("tcpClient");
</script>

<style>
</style>
