
pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                echo 'Downloading RoadPulse source code from GitHub'
                checkout scm
            }
        }

        stage('Validate Project') {
            steps {
                echo 'Checking RoadPulse project files'

                sh '''
                    test -f index.html
                    test -f style.css
                    test -f script.js
                    test -f Dockerfile

                    echo "All required project files are present!"
                '''
            }
        }

        stage('Build Complete') {
            steps {
                echo 'RoadPulse CI pipeline completed successfully!'
            }
        }
    }
}
