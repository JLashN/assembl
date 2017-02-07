import React from 'react';
import { Router, Route, IndexRoute } from 'react-router';
import App from './containers/app';
import Login from './containers/login';
import Signup from './containers/signup';
import ChangePassword from './containers/changePassword';
import Home from './containers/home';
import Ideas from './containers/ideas';
import Synthesis from './containers/synthesis';
import Debate from './containers/debate';
import Community from './containers/community';
import Profile from './containers/profile';
import Styleguide from './containers/styleguide';
import NotFound from './containers/notFound';
import Terms from './containers/terms';

export default (
  <Router>
    <Route path="/v2/" component={App}>
      <IndexRoute component={Home} />
      <Route path=":slug/home" component={Home} />
      <Route path=":slug/login" component={Login} />
      <Route path=":slug/signup" component={Signup} />
      <Route path=":slug/changePassword" component={ChangePassword} />
      <Route path=":slug/ideas" component={Ideas} />
      <Route path=":slug/synthesis" component={Synthesis} />
      <Route path=":slug/debate" component={Debate} />
      <Route path=":slug/community" component={Community} />
      <Route path=":slug/terms" component={Terms} />
    </Route>
    <Route path="/v2/">
      <Route path="profile" component={Profile} />
      <Route path="styleguide" component={Styleguide} />
    </Route>
    <Route path="*" component={NotFound} />
  </Router>
);