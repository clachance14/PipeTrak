## Table of Contents

* [Overview](#overview)
* [Usage](#usage)
* [Function Definition](#function-definition)
    * [Input](#input)
    * [Output](#output)
* [Errors](#errors)

## Overview

The `resendVerificationMail` mutation is used to resend the verification email to a user who has not yet verified their email address.

## Usage

```
import { resendVerificationMail } from "./resendVerificationMail";

const result = await resendVerificationMail({
  input: {
    userId: "user-id",
  },
});
```

## Function Definition

### Input

| Name | Type | Description |
|---|---|---|
| `userId` | `string` | The ID of the user to resend the verification email to. |

### Output

Returns nothing.

## Errors

| Code | Message |
|---|---|
| `NOT_FOUND` | User not found. |
| `BAD_REQUEST` | User's email is already verified. |
| `INTERNAL_SERVER_ERROR` | Could not send email. |