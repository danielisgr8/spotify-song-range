import React from 'react';
import { render } from "@testing-library/react";

import App from './App';

describe("<App />", () => {
  beforeAll(() => {
    delete window.location;
    window.location = {};
  })

  test("<AuthorizeComponent /> rendered with no query parameters", () => {
    window.location.search = "";
    const wrapper = render(<App />);
    wrapper.getByText("Login to Spotify");
  });

  test("<ErrorDisplay /> rendered with error query parameter", () => {
    window.location.search = "?error=testError";
    const wrapper = render(<App />);
    wrapper.getByText("testError");
  });

  test.todo("<SpotifyComponent /> rendered with code query parameter");
});
