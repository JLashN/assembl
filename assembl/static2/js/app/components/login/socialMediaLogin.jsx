import React from 'react';
import { form } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { get } from '../../utils/routeMap';

const convertNameToCssClass = name =>
  name
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .join('_');

const reverseString = s =>
  s
    .split('')
    .reverse()
    .join('');

export class SocialMedia extends React.Component {
  render() {
    const { slug } = this.props;
    let next;
    if (this.props.next) {
      next = this.props.next;
    } else if (slug) {
      next = get('home', { slug: this.props.slug });
    } else {
      next = null;
    }
    return (
      <div className="login-providers-list">
        <h4 className="dark-title-4">
          <Translate value="login.loginWithSocialMedia" />
        </h4>
        <ul>
          {this.props.providers.map((provider) => {
            let providerName = convertNameToCssClass(provider.name);
            let classNameIcon = providerName;
            let socialMediaName = provider.name;
            // to implement google social media button
            if (providerName === 'google-oauth2') {
              providerName = 'google';
              classNameIcon = 'gplus-1';
              socialMediaName = 'Google+';
            }
            return (
              <li key={provider.name}>
                <form id={reverseString(provider.name)} method="get" action={provider.login}>
                  {next ? <input type="hidden" name="next" value={`${next}`} /> : null}
                  {provider.extra &&
                    Object.keys(provider.extra).map(k => (
                      <input key={provider.name + k} type="hidden" name={k} value={provider.extra[k]} />
                    ))}
                  <button className={`btn btn-block btn-social btn-${providerName}`} type="submit">
                    <i className={`assembl-icon-${classNameIcon}`} />
                    {socialMediaName}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}