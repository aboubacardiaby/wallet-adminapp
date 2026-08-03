# Money and time zones

API money values must be decimal strings or integer minor units. UI helpers reject exponent notation and include the ISO currency code. Financial previews must use a decimal library and remain estimates until backend confirmation.

Timestamps travel as UTC ISO 8601. Display uses the applicable country, outlet, or user IANA timezone. Effective-date configuration must explicitly state its timezone rules.
