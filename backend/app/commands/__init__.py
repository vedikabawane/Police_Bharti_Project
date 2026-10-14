import click

from app.services.admin_password_reset_service import (
    AdminPasswordResetError,
    reset_existing_admin_password,
    validate_admin_password_reset_target,
)


def register_admin_password_reset_command(app):
    @app.cli.command("reset-admin-password")
    def reset_admin_password():
        """Interactively reset the password of an existing local Admin."""
        try:
            validate_admin_password_reset_target(
                app.config,
                testing=app.testing,
            )
            email = click.prompt("Existing Admin email", type=str)
            password = click.prompt(
                "New password",
                hide_input=True,
                confirmation_prompt=True,
            )
            click.confirm(
                "Reset the password for this existing Admin account?",
                abort=True,
            )
            reset_existing_admin_password(email, password)
        except AdminPasswordResetError as error:
            raise click.ClickException(str(error)) from None

        click.echo("Admin password reset successfully.")
