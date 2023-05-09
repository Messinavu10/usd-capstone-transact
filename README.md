# Team Transact - Verifiable Credentials Application

Project Description: Credential management application targeting college students, faculty, and surrounding business owners to create and verify credentials.

## Usage (Running the app locally)

1. Start by building the wrapper:

    ```bash
    npm install
    ```
    You might have to install jmespath and axios.

2. Install ngrok in your terminal:

    ```bash
    brew install --cask ngrok
    ```
    *Might be different for windows*

3. Start ngrok at port 8080:

     ```bash
    ngrok http 8080
    ```
4. Copy the link and put it in your .env file.

5. Add the link to azure app registration. (You need access to the azure tenant for this)

6. Run the project by selecting "Launch Program" in dropdown.

7. Open a browser at your ngrok link.

# Scenario 

## As an issuer (For example: USD) 

- USD administrator department go on Transact App and register a new organization issuer as USD 
- Next, it will pull out its own existing student database, and register each student under its organization 
- Once issue the credential, it can't be deleted, but it can have an expiration date 

## As a holder (For example: student) 

- Once he/she gets the credential from the issuer, he/she can access it by logging in to Transact Account and show it to the verifier. 

## As a verifier (For example: USD sports ticketing office) 

- Verifier are able to scan the QR code of any credential holder, and it will show whether the holder is a valid USD student. 
