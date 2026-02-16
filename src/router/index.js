import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import EventDetails from '../views/EventDetails.vue'
import Application from '../views/Application.vue'
import AdminApplications from '../views/AdminApplications.vue'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/attendance/events/:id',
    name: 'EventDetails',
    component: EventDetails,
    props: true
  },
  {
    path: '/applications',
    name: 'Application',
    component: Application
  },
  {
    path: '/manage/applications',
    name: 'AdminApplications',
    component: AdminApplications
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router